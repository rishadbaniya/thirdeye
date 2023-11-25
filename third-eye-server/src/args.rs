use clap::Parser;

#[derive(Parser, Debug, Clone)]
#[command(version, about)]
pub struct Args {
    /// The path of the config file
    #[arg(short, long, default_value = "Config.toml")]
    pub config: String,

    /// The path of the environment file
    #[arg(short, long, default_value = ".env")]
    pub env: String,

    /// The path of the log config file
    #[arg(short, long, default_value = "log_config.yml")]
    pub log_config: String,
}
