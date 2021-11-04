"""
Copyright 2021 Objectiv B.V.
"""
from abc import ABC
from typing import cast, Union, TYPE_CHECKING, Optional

import numpy

from bach import DataFrame
from bach.series import Series, const_to_series
from bach.expression import Expression
from bach.series.series import WrappedPartition

if TYPE_CHECKING:
    from bach.partitioning import GroupBy


class SeriesAbstractNumeric(Series, ABC):
    """
    Base class that defines shared logic between SeriesInt64 and SeriesFloat64
    """

    def __add__(self, other) -> 'Series':
        other = const_to_series(base=self, value=other)
        self._check_supported('add', ['int64', 'float64'], other)
        expression = Expression.construct('({}) + ({})', self, other)
        new_dtype = 'float64' if 'float64' in (self.dtype, other.dtype) else 'int64'
        return self.copy_override(dtype=new_dtype, expression=expression)

    def __sub__(self, other) -> 'Series':
        other = const_to_series(base=self, value=other)
        self._check_supported('sub', ['int64', 'float64'], other)
        expression = Expression.construct('({}) - ({})', self, other)
        new_dtype = 'float64' if 'float64' in (self.dtype, other.dtype) else 'int64'
        return self.copy_override(dtype=new_dtype, expression=expression)

    def _comparator_operator(self, other, comparator):
        other = const_to_series(base=self, value=other)
        self._check_supported(f"comparator '{comparator}'", ['int64', 'float64'], other)
        expression = Expression.construct(f'({{}}) {comparator} ({{}})', self, other)
        return self.copy_override(dtype='bool', expression=expression)

    def __truediv__(self, other):
        other = const_to_series(base=self, value=other)
        self._check_supported('division', ['int64', 'float64'], other)
        expression = Expression.construct('cast({} as float) / ({})', self, other)
        return self.copy_override(dtype='float64', expression=expression)

    def __floordiv__(self, other):
        other = const_to_series(base=self, value=other)
        self._check_supported('division', ['int64', 'float64'], other)
        expression = Expression.construct('cast({} as bigint) / ({})', self, other)
        return self.copy_override(dtype='int64', expression=expression)

    def round(self, decimals: int = 0):
        return self.copy_override(
            expression=Expression.construct(f'round(cast({{}} as numeric), {decimals})', self)
        )

    def _ddof_unsupported(self, ddof: Optional[int]):
        if ddof is not None and ddof != 1:
            raise NotImplementedError("ddof != 1 currently not implemented")

    def kurt(self, partition: WrappedPartition = None, skipna: bool = True):
        return self.kurtosis(partition, skipna)

    def kurtosis(self, partition: WrappedPartition = None, skipna: bool = True):
        raise NotImplementedError("kurtosis currently not implemented")

    def mad(self, partition: WrappedPartition = None, skipna: bool = True):
        raise NotImplementedError("mad currently not implemented")

    def prod(self, partition: WrappedPartition = None, skipna: bool = True):
        return self.product(partition, skipna)

    def product(self, partition: WrappedPartition = None, skipna: bool = True):
        # https://stackoverflow.com/questions/13156055/product-aggregate-in-postgresql
        # horrible solution, but best we have until we support custom defined aggregates
        return self._derived_agg_func(
            partition,
            Expression.construct(f'exp(sum(ln({{}})))', self),
            skipna=skipna
        )

    def skew(self, partition: WrappedPartition = None, skipna: bool = True):
        raise NotImplementedError("skew currently not implemented")

    def sem(self, partition: WrappedPartition = None, skipna: bool = True, ddof: int = None):
        self._ddof_unsupported(ddof)
        return self._derived_agg_func(
            partition,
            Expression.construct(f'{{}}/sqrt({{}})',
                                 self.std(partition, skipna=skipna, ddof=ddof),
                                 self.count(partition, skipna=skipna)),
            skipna=skipna
        )

    def std(self, partition: WrappedPartition = None, skipna: bool = True, ddof: int = None):
        # sample standard deviation of the input values
        self._ddof_unsupported(ddof)
        return self._derived_agg_func(partition, 'stddev_samp', skipna=skipna)

    def sum(self, partition: WrappedPartition = None, skipna: bool = True, min_count: int = None):
        return self._derived_agg_func(partition, 'sum', skipna=skipna, min_count=min_count)

    def mean(self, partition: WrappedPartition = None, skipna: bool = True) -> 'SeriesFloat64':
        return cast('SeriesFloat64',  # for the mypies
                    self._derived_agg_func(partition, 'avg', 'double precision', skipna=skipna))

    def var(self, partition: WrappedPartition = None, skipna: bool = True, ddof: int = None):
        # sample variance of the input values (square of the sample standard deviation)
        self._ddof_unsupported(ddof)
        return self._derived_agg_func(partition, 'var_samp', skipna=skipna)


class SeriesInt64(SeriesAbstractNumeric):
    dtype = 'int64'
    dtype_aliases = ('integer', 'bigint', 'i8', int, numpy.int64)
    supported_db_dtype = 'bigint'
    supported_value_types = (int, numpy.int64)

    @classmethod
    def supported_value_to_expression(cls, value: int) -> Expression:
        # A stringified integer is a valid integer or bigint literal, depending on the size. We want to
        # consistently get bigints, so always cast the result
        # See the section on numeric constants in the Postgres documentation
        # https://www.postgresql.org/docs/14/sql-syntax-lexical.html#SQL-SYNTAX-CONSTANTS
        return Expression.construct('cast({} as bigint)', Expression.raw(str(value)))

    @classmethod
    def dtype_to_expression(cls, source_dtype: str, expression: Expression) -> Expression:
        if source_dtype == 'int64':
            return expression
        if source_dtype not in ['float64', 'bool', 'string']:
            raise ValueError(f'cannot convert {source_dtype} to int64')
        return Expression.construct('cast({} as bigint)', expression)


class SeriesFloat64(SeriesAbstractNumeric):
    dtype = 'float64'
    dtype_aliases = ('float', 'double', 'f8', float, numpy.float64, 'double precision')
    supported_db_dtype = 'double precision'
    supported_value_types = (float, numpy.float64)

    @classmethod
    def supported_value_to_expression(cls, value: Union[float, numpy.float64]) -> Expression:
        # Postgres will automatically parse any number with a decimal point as a number of type `numeric`,
        # which could be casted to float. However we specify the value always as a string, as there are some
        # values that cannot be expressed as a numeric literal directly (NaN, infinity, and -infinity), and
        # a value that cannot be represented as numeric (-0.0).
        # See the sections on numeric constants, and on fLoating-point types in the Postgres documentation
        # https://www.postgresql.org/docs/14/sql-syntax-lexical.html#SQL-SYNTAX-CONSTANTS
        # https://www.postgresql.org/docs/14/datatype-numeric.html#DATATYPE-FLOAT
        str_value = str(value)
        return Expression.construct("cast({} as float)", Expression.string_value(str_value))

    @classmethod
    def dtype_to_expression(cls, source_dtype: str, expression: Expression) -> Expression:
        if source_dtype == 'float64':
            return expression
        if source_dtype not in ['int64', 'string']:
            raise ValueError(f'cannot convert {source_dtype} to float64')
        return Expression.construct('cast({} as float)', expression)