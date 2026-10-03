// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Janela mínima e transparente que fica por cima do ícone da bandeja. O tray não
/// recebe arquivos arrastados, mas uma janela recebe: ela avisa a janela principal
/// (que abre) e repassa os cliques, já que está cobrindo o ícone de verdade.
#[cfg(desktop)]
fn setup_tray_drop(app: &tauri::AppHandle) -> tauri::Result<()> {
    use std::{thread, time::Duration};
    use tauri::{PhysicalPosition, PhysicalSize, WebviewUrl, WebviewWindowBuilder};

    let win = WebviewWindowBuilder::new(app, "tray-drop", WebviewUrl::App("tray-drop.html".into()))
        .inner_size(24.0, 24.0)
        .transparent(true)
        .decorations(false)
        .shadow(false)
        .resizable(false)
        .skip_taskbar(true)
        .always_on_top(true)
        .focusable(false)
        .visible(false)
        .build()?;

    let app = app.clone();
    // O ícone muda de lugar (barra de tarefas movida, ícones reordenados, outro monitor),
    // então a janela reacompanha a posição dele em vez de assumir um lugar fixo.
    thread::spawn(move || loop {
        thread::sleep(Duration::from_millis(500));

        let Some(tray) = app.tray_by_id("main-tray") else {
            continue;
        };
        // Linux não informa a posição do tray; a janela nunca aparece lá.
        let Ok(Some(rect)) = tray.rect() else {
            continue;
        };

        let scale = win.scale_factor().unwrap_or(1.0);
        let pos = rect.position.to_physical::<i32>(scale);
        let size = rect.size.to_physical::<u32>(scale);

        // Ícone escondido no menu de ocultos do Windows: o centro dele cai dentro da área
        // de trabalho (a bandeja de verdade fica na faixa da barra de tarefas, fora dela).
        // Nesse caso a janela some, para não cobrir outra coisa sem ter ícone embaixo.
        #[cfg(windows)]
        {
            let cx = pos.x as f64 + size.width as f64 / 2.0;
            let cy = pos.y as f64 + size.height as f64 / 2.0;
            if let Ok(Some(monitor)) = win.monitor_from_point(cx, cy) {
                let wa = monitor.work_area();
                let inside = cx >= wa.position.x as f64
                    && cx < (wa.position.x + wa.size.width as i32) as f64
                    && cy >= wa.position.y as f64
                    && cy < (wa.position.y + wa.size.height as i32) as f64;
                if inside {
                    let _ = win.hide();
                    continue;
                }
            }
        }

        let _ = win.set_size(PhysicalSize::new(size.width, size.height));
        let _ = win.set_position(PhysicalPosition::new(pos.x, pos.y));
        if !win.is_visible().unwrap_or(false) {
            let _ = win.show();
        }
        // A barra de tarefas também é "sempre por cima" e se re-eleva a cada interação;
        // sem reafirmar, ela acaba cobrindo esta janela e o drag nunca chega nela.
        // O Tauri ignora set_always_on_top quando o estado não muda, então o Windows é
        // chamado direto: sobe a janela ao topo da faixa "topmost" sem ativá-la nem mover.
        #[cfg(windows)]
        if let Ok(hwnd) = win.hwnd() {
            use windows::Win32::UI::WindowsAndMessaging::{
                SetWindowPos, HWND_TOPMOST, SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOSIZE,
            };
            unsafe {
                let _ = SetWindowPos(
                    hwnd,
                    Some(HWND_TOPMOST),
                    0,
                    0,
                    0,
                    0,
                    SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE,
                );
            }
        }
        #[cfg(not(windows))]
        let _ = win.set_always_on_top(true);
    });

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init());

    // Autostart só existe no desktop. A janela já nasce escondida (visible: false),
    // então iniciar com o sistema abre apenas o tray.
    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_autostart::init(
        tauri_plugin_autostart::MacosLauncher::LaunchAgent,
        None,
    ));

    builder
        .setup(|app| {
            #[cfg(desktop)]
            setup_tray_drop(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
