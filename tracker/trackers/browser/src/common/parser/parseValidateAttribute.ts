import { ValidateAttribute } from '../../definitions/ValidateAttribute';
import { parseJson } from './parseJson';

/**
 * `validate` Tagging Attribute parser
 */
export const parseValidateAttribute = (stringifiedValidateAttribute: string | null) => {
  return parseJson(stringifiedValidateAttribute ?? '{}', ValidateAttribute);
};
