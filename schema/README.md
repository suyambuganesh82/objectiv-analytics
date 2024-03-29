# The Open Taxonomy for Analytics

The Open Taxonomy for Analytics is Objectiv’s proposal for a common way to collect, structure and validate data. It defines classes for each common event type and the contexts in which they can happen. It describes their properties, requirements and their relationships with other classes. 

The current version of the taxonomy is built for product analytics. We have plans to support other fields as well.

Objectiv uses the Open Taxonomy to:
* Enable realtime validation of instrumentation and provide debugging feedback.
* Structure and validate data collection at the first step of the pipeline.
* Enable effective feature creation when building models.
* Enable models and datasets to be reused with minimal effort.

The Open Taxonomy for Analytics is captured in a schema that is loosely based on JSON-schema and uses JSON5 encoding to allow for multiline strings. 

## Using the Open Taxonomy
Objectiv is built around the Open Taxonomy and the Tracker, Collector and Bach use it out of the box.

For detailed installation & usage instructions of Objectiv, visit [Objectiv Docs](https://www.objectiv.io/docs).

## Support & Troubleshooting
If you need help with the Open Taxonomy, join our [Slack channel](https://objectiv.io/join-slack/) and post your question there. 

## Bug Reports & Feature Requests
If you’ve found an issue or have a feature request, please check out the [Contribution Guide](https://objectiv.io/docs/home/the-project/contribute/).

## Security Disclosure
Found a security issue? Please don’t use the issue tracker but contact us directly. See [SECURITY.md](../SECURITY.md) for details.

## Custom Development & Contributing Code
If you want to contribute to the Open Taxonomy or use it as a base for custom development, take a look at [CONTRIBUTING.md](CONTRIBUTING.md). It contains detailed development instructions and a link to information about our contribution process and where you can fit in.

## License
This repository is part of the source code for Objectiv, which is released under the Apache 2.0 License. Please refer to [LICENSE.md](../LICENSE.md) for details.

Unless otherwise noted, all files © 2021 Objectiv B.V.
