import { gql, ApolloServer } from "apollo-server-micro";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import {Neo4jGraphQL} from "@neo4j/graphql"
import neo4j from "neo4j-driver"
import 'ts-tiny-invariant' // importing this module as a workaround for issue described here: https://github.com/vercel/vercel/discussions/5846


const typeDefs = gql`
  type User @exclude(operations: [CREATE, UPDATE, DELETE]) {
    username: String
    created: DateTime
    karma: Int
    about: String
    avatar: String
    articles: [Article] @relationship(type: "SUBMITTED", direction: OUT)
    invited: [User] @relationship(type: "INVITED_BY", direction: IN)
    invited_by: [User] @relationship(type: "INVITED_BY", direction: OUT)
  }

  type Article @exclude(operations: [CREATE, UPDATE, DELETE]) {
      id: ID
      url: String
      score: Int
      title: String
      comments: String
      created: DateTime
      user: User @relationship(type: "SUBMITTED", direction: IN)
      tags: [Tag] @relationship(type: "HAS_TAG", direction: OUT)
  }

  type Tag @exclude(operations: [CREATE, UPDATE, DELETE]) {
      name: String
      articles: [Article] @relationship(type: "HAS_TAG", direction: IN)
  }
`;

const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
)

const neoSchema = new Neo4jGraphQL({typeDefs, driver})

const apolloServer = new ApolloServer({
  schema: neoSchema.schema,
  playground: true,
  introspection: true,
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
});

const startServer = apolloServer.start();

export default async function handler(req, res) {
  await startServer;
  await apolloServer.createHandler({
    path: "/api/graphql",
  })(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};