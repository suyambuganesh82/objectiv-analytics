"""
Copyright 2021 Objectiv B.V.
"""
from dataclasses import dataclass, field

from typing import Optional, Union, TYPE_CHECKING, List, Dict
from sql_models.model import SqlModel, SqlModelSpec
from sql_models.util import quote_string, quote_identifier

if TYPE_CHECKING:
    from bach import Series
    from bach.sql_model import BachSqlModel


@dataclass(frozen=True)
class ExpressionToken:
    """ Abstract base class of ExpressionTokens"""

    def __post_init__(self):
        # Make sure that other code can rely on an ExpressionToken always being a subclass of this class.
        if self.__class__ == ExpressionToken:
            raise TypeError("Cannot instantiate ExpressionToken directly. Instantiate a subclass.")


@dataclass(frozen=True)
class RawToken(ExpressionToken):
    raw: str


@dataclass(frozen=True)
class ColumnReferenceToken(ExpressionToken):
    column_name: str


@dataclass(frozen=True)
class ModelReferenceToken(ExpressionToken):
    model: SqlModel['BachSqlModel']

    def refname(self) -> str:
        return f'reference{self.model.hash}'


@dataclass(frozen=True)
class StringValueToken(ExpressionToken):
    """ Wraps a string value. The value in this object is unescaped and unquoted. """
    value: str


@dataclass(frozen=True)
class Expression:
    """
    An Expression object represents a fragment of SQL as a series of sql-tokens.

    Expressions can easily be converted to a string with actual sql using the to_sql() function. Storing a
    sql-expression using this class, rather than storing it directly as a string, makes it possible to
    for example substitute the table-name after constructing the expression.
    Additionally this move this burden of correctly quoting and escaping string literals to this class, if
    literals are expressed with the correct tokens at least.
    In the future we might add support for more literal types.

    This class does not offer full-tokenization of sql. There are only a limited number of tokens for the
    needed use-cases. Most sql is simply encoded as a 'raw' token.
    """
    data: List[ExpressionToken] = field(default_factory=list)

    @classmethod
    def construct(cls, fmt: str, *args: Union['Expression', 'Series']) -> 'Expression':
        """
        Construct an Expression using a format string that can refer existing expressions.
        Every occurrence of `{}` in the fmt string will be replace with a provided expression (in order that
        they are given). All other parts of fmt will be converted to RawTokens.

        As a convenience, instead of Expressions it is also possible to give Series as args, in that
        case the series's expression is taken as Expression.

        :param fmt: format string
        :param args: 0 or more Expressions or Series. Number of args must exactly match number of `{}`
            occurrences in fmt.
        """
        sub_strs = fmt.split('{}')
        data = []
        if len(args) != len(sub_strs) - 1:
            raise ValueError(f'For each {{}} in the fmt there should be an Expression provided. '
                             f'Found {{}}: {len(sub_strs) - 1}, provided expressions: {len(args)}')
        for i, sub_str in enumerate(sub_strs):
            if i > 0:
                arg = args[i - 1]
                if not isinstance(arg, Expression):  # arg is a Series
                    arg_expr = arg.expression
                else:
                    arg_expr = arg
                data.extend(arg_expr.data)
            if sub_str != '':
                data.append(RawToken(raw=sub_str))
        return cls(data=data)

    @classmethod
    def raw(cls, raw: str) -> 'Expression':
        """ Return an expression that contains a single RawToken. """
        return cls([RawToken(raw)])

    @classmethod
    def string_value(cls, value: str) -> 'Expression':
        """
        Return an expression that contains a single StringValueToken with the value.
        :param value: unquoted, unescaped string value.
        """
        return Expression([StringValueToken(value)])

    @classmethod
    def column_reference(cls, field_name: str) -> 'Expression':
        """ Construct an expression for field-name, where field-name is a column in a table or CTE. """
        return Expression([ColumnReferenceToken(field_name)])

    @classmethod
    def model_reference(cls, model: SqlModel['BachSqlModel']) -> 'Expression':
        """ Construct an expression for model, where model is a reference to a model. """
        return Expression([ModelReferenceToken(model)])

    def resolve_column_references(self, table_name: str = None):
        """ resolve the table name aliases for all columns in this expression """
        result: List[ExpressionToken] = []
        for data_item in self.data:
            if isinstance(data_item, ColumnReferenceToken):
                t = f'{quote_identifier(table_name)}.' if table_name else ''
                result.append(RawToken(f'{t}{quote_identifier(data_item.column_name)}'))
            else:
                result.append(data_item)
        return Expression(result)

    def get_references(self) -> Dict[str, SqlModel['BachSqlModel']]:
        rv = {}
        for data_item in self.data:
            if isinstance(data_item, ModelReferenceToken):
                rv[data_item.refname()] = data_item.model
        return rv

    def to_sql(self, table_name: Optional[str] = None) -> str:
        """ Short cut for expression_to_sql(self, table_name). """
        return expression_to_sql(self.resolve_column_references(table_name))


def expression_to_sql(expression: Expression) -> str:
    """
    Compile the expression to a SQL fragment.
        * RawTokens will be represented by the raw string they embed.
        * StringValueTokens will be quoted and escaped
        * ColumnReferenceTokens will be quoted and escaped, and if table_name is provided preceded by the
            table name.
    :param expression: Expression
    :param table_name: Optional table name, if set all column-references will be compiled as
        '"{table_name}"."{column_name}"' instead of just '"{column_name}"'.
    :return SQL representation of the expression.
    """
    result: List[str] = []
    for data_item in expression.data:
        if isinstance(data_item, ColumnReferenceToken):
            raise ValueError('ColumnReferenceTokens should be resolved first using '
                             'Expression.resolve_column_references')
        elif isinstance(data_item, ModelReferenceToken):
            result.append(f'{{{data_item.refname()}}}')
        elif isinstance(data_item, RawToken):
            result.append(SqlModelSpec.escape_format_string(data_item.raw))
        elif isinstance(data_item, StringValueToken):
            result.append(SqlModelSpec.escape_format_string(quote_string(data_item.value)))
        else:
            raise Exception("This should never happen. "
                            "expression_to_sql() doesn't cover all Expression subtypes."
                            f"type: {type(data_item)}")
    return ''.join(result)