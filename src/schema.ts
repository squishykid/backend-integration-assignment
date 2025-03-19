import { SchemaComposer } from "graphql-compose";
import { Consumption } from "./feature/energy_consumption/consumption";
import { Info } from "./feature/blockchain_info/info";
import { Blockchain } from "./client/blockchain";
import { Cache } from "./client/cache";
import { Redis } from "ioredis";

const schemaComposer = new SchemaComposer();
const client = new Blockchain();
const cache = new Cache(new Redis());
const info = new Info(client, cache);
const consumption = new Consumption(info, 4.56)

const LastNDaysTC = schemaComposer.createObjectTC({
  name: 'LastNDays',
  fields: {
    days: 'Int!',
    energy: 'Float!',
  },
});

const TransactionTC = schemaComposer.createObjectTC({
  name: 'Transaction',
  fields: {
    hash: 'String!',
    energy: 'Float!',
    size: 'Int!',
  },
});

const BlockEnergyTC = schemaComposer.createObjectTC({
  name: 'BlockEnergy',
  fields: {
    hash: 'String!',
    energy: 'Float!',
    tx: [TransactionTC],
  },
});

schemaComposer.Query.addFields({
  hello: {
    type: () => "String!",
    resolve: () => "Hi there, good luck with the assignment!",
  },
  lastDays: {
    type: () => "LastNDays!",
    args: { days: 'Int!' },
    resolve: (_, { days }) => consumption.getConsumptionForLastDays(days),
  },
  blockEnergy: {
    type: () => "BlockEnergy!",
    args: { hash: 'String!' },
    resolve: (_, { hash }) => consumption.getConsumptionPerTransaction(hash)
  }
});

export const schema = schemaComposer.buildSchema();
