use clap::Parser;

#[derive(Parser, Debug, Clone)]
#[command(version, about)]
pub struct Args {
    /// The path of the config file
    #[arg(short, long, default_value = "Config.toml")]
    pub config: String,
    // TODO: Add log
}
