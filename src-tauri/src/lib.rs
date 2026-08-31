#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri::plugin::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running CineTheme application");
}
