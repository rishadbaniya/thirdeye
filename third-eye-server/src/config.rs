use anyhow::Context;
use serde::Deserialize;

use crate::args::Args;
use std::{fs::File, io::Read, env};

#[derive(Debug, Deserialize)]
pub struct ThirdEyeServerConfig {
    /// The attributes necessary to communicate with Neo4j Database
    #[serde(skip_deserializing)]
    pub mongodb_config: Option<MongoDBConfig>,

    #[serde(rename="http_server")]
    pub http_server_config: HttpServerConfig,

    #[serde(rename="grpc_server")]
    pub grpc_server_config: gRPCServerConfig,


}


// The config for MongoDB Database
#[derive(Debug, Clone)]
pub struct MongoDBConfig {
    pub url: String,

    pub username: String,

    pub password: String,

    pub database: String,

}

impl ThirdEyeServerConfig{
    pub fn from_env_and_config_file(args: &Args) -> anyhow::Result<Self> {
        dotenv::from_path(args.env.as_str()).context("env file missing!")?;

        let mut third_eye_server_config: ThirdEyeServerConfig = {
            let config_file_path = args.config.as_str();
            let mut config_file = File::open(config_file_path).context("The config file doesn't exist")?;
            let mut config_file_contents = String::new();
            config_file.read_to_string(&mut config_file_contents)
                .context("Error in reading the config file")?;

            toml::from_str(config_file_contents.as_str())?
        };

        macro_rules! env_var {
            ($v:ident) => {
                env::var(stringify!($v)).context(concat!(stringify!($v), " not found as environment variable"))?
            };
        }

        third_eye_server_config.mongodb_config = {
            let url = env_var!(MONGODB_ADDR);
            let username = env_var!(MONGODB_USERNAME);
            let password = env_var!(MONGODB_PASSWORD);
            let database = env_var!(MONGODB_DATABASE);
            Some(MongoDBConfig {
                url,
                username,
                password,
                database,
            })
        };

        third_eye_server_config.http_server_config.access_token_key = {
            let key = env_var!(ACCESS_TOKEN_KEY);
            Some(key)
        };

        third_eye_server_config.http_server_config.refresh_token_key = {
            let key = env_var!(REFRESH_TOKEN_KEY);
            Some(key)
        };
        Ok(third_eye_server_config)
    }
}

#[derive(Debug, Deserialize, Clone)]
pub struct HttpServerConfig{
    pub address : String,

    /// Email of users that can't be deleted
    pub undeletable: Vec<String>,
    
    /// Default admin full name
    pub default_admin_fullName: String,

    /// Default admin email
    pub default_admin_email: String,

    /// Default admin password
    pub default_admin_password: String,

    /// Access Token expirty time in minutes
    pub access_token_expiry_time: i64,

    /// Refresh Token expirty time in minutes
    pub refresh_token_expiry_time: i64,

    /// The key used to decode and encode access token
    #[serde(skip_deserializing)]
    pub access_token_key: Option<String>,

    /// The key used to decode and encode access token
    #[serde(skip_deserializing)]
    pub refresh_token_key: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct gRPCServerConfig{
    pub address : String
}
