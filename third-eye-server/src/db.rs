use mongodb::{options::ClientOptions, Client, Database};
use crate::config::MongoDBConfig;

pub struct MongoDBClient {
    client: Client,

    pub database: Database,
}

impl MongoDBClient {
    /// Creates a new [MongoDBClient] from the given [MongoDBConfig]
    pub async fn new(config: &MongoDBConfig) -> anyhow::Result<Self> {
        let url = format!("mongodb://{}:{}@{}", config.username, config.password, config.url);
        println!("{:?}", url);
        let client_options = ClientOptions::parse(url).await?;
        let client = Client::with_options(client_options)?;
        let database = client.database(&config.database);

        Ok(Self { client, database })
    }
}
