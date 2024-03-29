.. _models:

==============
Model overview
==============

.. currentmodule:: modelhub

The model hub has two main type of functions: `map` and `aggregate`.

- `map` functions always return a series with the same shape and index as the DataFrame they are applied to.
  This ensures they can be added as a column to that DataFrame. `map` functions that return SeriesBoolean can
  be used with to filter the data.
- `aggregate` fuctions return aggregated data in some form from the DataFrame. Can also be accessed with
  `agg`.

.. Generate links in the toctree, but don't show the TOC itself in this page
.. rst-class:: hide_toctree_ul

.. toctree:: 

    models_mapping

.. rubric:: Mapping

.. autosummary::
    Map.is_first_session
    Map.is_new_user
    Map.is_conversion_event
    Map.conversions_counter
    Map.conversions_in_time
    Map.pre_conversion_hit_number


.. Generate links in the toctree, but don't show the TOC itself in this page
.. rst-class:: hide_toctree_ul

.. toctree:: 

    models_aggregation

.. rubric:: Aggregation

.. autosummary::
    Aggregate.unique_users
    Aggregate.unique_sessions
    Aggregate.session_duration
    Aggregate.frequency
