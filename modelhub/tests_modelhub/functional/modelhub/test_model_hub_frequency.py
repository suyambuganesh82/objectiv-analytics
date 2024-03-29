"""
Copyright 2021 Objectiv B.V.
"""

# Any import from from modelhub initializes all the types, do not remove
from modelhub import __version__
from tests_modelhub.functional.modelhub.data_and_utils import get_objectiv_dataframe_test
from tests.functional.bach.test_data_and_utils import assert_equals_data

def test_frequency():
    df, modelhub = get_objectiv_dataframe_test()
    s = modelhub.aggregate.frequency(df)

    assert_equals_data(
        s,
        expected_columns=['session_id_nunique', 'user_id_nunique'],
        expected_data=[
            [1, 1],
            [2, 3]
        ]
    )
