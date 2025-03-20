import { SchemaComposer } from "graphql-compose";
import { Consumption } from "./feature/energy_consumption/consumption";
import { GraphQLSchema } from "graphql";

export const buildSchema = (consumption: Consumption): GraphQLSchema => {
  const schemaComposer = new SchemaComposer();
  const EnergyOnDayTC = schemaComposer.createObjectTC({
    name: "EnergyOnDay",
    fields: {
      dayInMs: "Float!",
      daysAgo: "Int!",
      energy: "Float!",
    },
  });

  const TransactionTC = schemaComposer.createObjectTC({
    name: "Transaction",
    fields: {
      hash: "String!",
      energy: "Float!",
      size: "Int!",
    },
  });

  const BlockEnergyTC = schemaComposer.createObjectTC({
    name: "BlockEnergy",
    fields: {
      hash: "String!",
      energy: "Float!",
      tx: [TransactionTC],
    },
  });

  schemaComposer.Query.addFields({
    lastDays: {
      type: () => [EnergyOnDayTC],
      args: { days: "Int!" },
      resolve: (_, { days }) => consumption.getConsumptionForLastDays(days),
    },
    blockEnergy: {
      type: () => BlockEnergyTC,
      args: { hash: "String!" },
      resolve: (_, { hash }) => consumption.getConsumptionPerTransaction(hash),
    },
  });
  return schemaComposer.buildSchema();
};
