"""
Copyright 2021 Objectiv B.V.
"""
import pytest

from bach import DataFrame, SeriesString, Series
from tests.functional.bach.test_data_and_utils import assert_equals_data, get_bt_with_test_data, df_to_list


def test_get_item_single():
    bt = get_bt_with_test_data()

    selection = bt[['city']]
    assert isinstance(selection, DataFrame)
    assert_equals_data(
        selection,
        expected_columns=['_index_skating_order', 'city'],
        expected_data=[
            [1, 'Ljouwert'],
            [2, 'Snits'],
            [3, 'Drylts'],
        ]
    )

    selection = bt[['inhabitants']]
    assert isinstance(selection, DataFrame)
    assert_equals_data(
        selection,
        expected_columns=['_index_skating_order', 'inhabitants'],
        expected_data=[
            [1, 93485],
            [2, 33520],
            [3, 3055],
        ]
    )

    selection = bt['city']
    assert isinstance(selection, Series)
    assert_equals_data(
        selection,
        expected_columns=['_index_skating_order', 'city'],
        expected_data=[
            [1, 'Ljouwert'],
            [2, 'Snits'],
            [3, 'Drylts'],
        ]
    )
    # todo: pandas supports _a lot_ of way to select columns and/or rows


def test_get_series_single():
    bt = get_bt_with_test_data()

    series = bt['city']
    assert isinstance(series, SeriesString)

    value = series[1]

    assert isinstance(value, str)
    assert value == 'Ljouwert'


def test_get_item_multiple():
    bt = get_bt_with_test_data()
    selection = bt[['city', 'founding']]
    assert isinstance(selection, DataFrame)
    assert_equals_data(
        selection,
        expected_columns=['_index_skating_order', 'city', 'founding'],
        expected_data=[
            [1, 'Ljouwert', 1285],
            [2, 'Snits',  1456],
            [3, 'Drylts', 1268],
        ]
    )


def test_positional_slicing():
    bt = get_bt_with_test_data(full_data_set=True)

    class ReturnSlice:
        def __getitem__(self, key):
            return key
    return_slice = ReturnSlice()

    slice_list = [return_slice[:4],
                  return_slice[4:],
                  return_slice[4:7],
                  return_slice[:]
                  ]
    for slice in slice_list:
        assert_equals_data(
            bt[slice],
            expected_columns=['_index_skating_order', 'skating_order', 'city', 'municipality', 'inhabitants',
                              'founding'],
            expected_data=df_to_list(bt.to_df()[slice])
        )


def test_get_item_materialize():
    bt = get_bt_with_test_data(full_data_set=True)[['municipality', 'inhabitants']]
    bt = bt.groupby('municipality')[['inhabitants']].sum()
    r = bt[bt.inhabitants_sum != 700] #  'Friese Meren' be gone!

    assert_equals_data(
        r,
        order_by='inhabitants_sum',
        expected_columns=['municipality', 'inhabitants_sum'],
        expected_data=[
            ['Noardeast-Fryslân', 12675], ['Waadhoeke', 12760],
            ['Harlingen', 14740], ['Súdwest-Fryslân', 52965],
            ['Leeuwarden', 93485]
        ]
    )


def test_get_item_slice():
    bt = get_bt_with_test_data(full_data_set=True)[['municipality']]
    r = bt[2:5]

    assert_equals_data(
        r,
        expected_columns=['_index_skating_order', 'municipality'],
        expected_data=[
            [3, 'Súdwest-Fryslân'], [4, 'De Friese Meren'], [5, 'Súdwest-Fryslân']
        ]
    )