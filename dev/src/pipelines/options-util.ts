import {ObjectValue, Serializer} from '../serializer';
import {ObjectValueFieldPath} from '../path';
import {ApiMapValue} from '../types';
import {isPlainObject, mapToArray} from '../util';
import {google} from '../../protos/firestore_v1_proto_api';
import IValue = google.firestore.v1.IValue;
import {isField, isNumber, isString} from './pipeline-util';
export type OptionsDefinitions = Record<string, OptionDefinition>;
export type OptionDefinition = {
  serverName: string;
  supportedTypes: {
    string?: boolean;
    number?: boolean;
    field?: boolean;
    nestedOptions?: OptionsDefinitions;
  };
};

export class OptionsUtil {
  constructor(private optionDefinitions: OptionsDefinitions) {}

  private _getKnownOptions(
    options: Record<string, unknown>,
    serializer: Serializer
  ): ObjectValue {
    const knownOptions: ObjectValue = ObjectValue.empty();

    // SERIALIZE KNOWN OPTIONS
    for (const knownOptionKey in this.optionDefinitions) {
      const optionDefinition: OptionDefinition =
        this.optionDefinitions[knownOptionKey];

      if (knownOptionKey in options) {
        const optionValue: unknown = options[knownOptionKey];
        let protoValue: IValue | undefined = undefined;

        if (optionDefinition.supportedTypes.string && isString(optionValue)) {
          protoValue = serializer.encodeValue(optionValue);
        } else if (
          optionDefinition.supportedTypes.number &&
          isNumber(optionValue)
        ) {
          protoValue = serializer.encodeValue(optionValue);
        } else if (
          optionDefinition.supportedTypes.field &&
          isField(optionValue)
        ) {
          protoValue = serializer.encodeValue(optionValue)!;
        } else if (
          optionDefinition.supportedTypes.nestedOptions &&
          isPlainObject(optionValue)
        ) {
          const nestedUtil = new OptionsUtil(
            optionDefinition.supportedTypes.nestedOptions
          );
          protoValue = {
            mapValue: {
              fields: nestedUtil.getOptionsProto(serializer, optionValue),
            },
          };
        } else if (optionValue !== undefined) {
          throw new Error(
            `Unsupported value for option '${knownOptionKey}': ${optionValue}`
          );
        }

        if (protoValue) {
          knownOptions.set(
            new ObjectValueFieldPath(optionDefinition.serverName),
            protoValue
          );
        }
      }
    }

    return knownOptions;
  }

  getOptionsProto(
    serializer: Serializer,
    knownOptions: Record<string, unknown>,
    optionsOverride?: Record<string, unknown>
  ): ApiMapValue {
    const result: ObjectValue = this._getKnownOptions(knownOptions, serializer);

    // APPLY OPTIONS OVERRIDES
    if (optionsOverride) {
      const optionsMap = new Map(
        mapToArray(optionsOverride, (value, key) => [
          ObjectValueFieldPath.fromDotNotation(key),
          value !== undefined ? serializer.encodeValue(value) : null,
        ])
      );
      result.setAll(optionsMap);
    }

    // Return IMapValue from `result`
    return result.value.mapValue.fields ?? {};
  }
}
