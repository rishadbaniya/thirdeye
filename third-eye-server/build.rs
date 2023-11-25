use std::{env, path::PathBuf};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let out_dir = PathBuf::from(env::var("OUT_DIR")?);
     println!("out_dir:?");  

    tonic_build::configure()
        .file_descriptor_set_path(out_dir.join("descriptor.bin"))
        .compile(&["proto/data_exchange.proto"], &["proto"])?;
    Ok(())
}
