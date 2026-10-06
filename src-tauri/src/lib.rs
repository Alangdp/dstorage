/// Tiny transparent window over the tray icon. The tray cannot receive dragged files, but
/// a window can: when a drag enters the icon's area it tells the main window, which opens
/// so the user can drop the file.
///
/// The window is "invisible to the mouse": clicks pass through to the real icon, its
/// tooltip and the hidden-icons arrow button. It only becomes a drop target while a drag
/// that started outside the icon is over it; a plain click starts inside and is never
/// captured.
#[cfg(windows)]
fn setup_tray_drop(app: &tauri::AppHandle) -> tauri::Result<()> {
    use std::{thread, time::Duration};
    use tauri::{PhysicalPosition, PhysicalSize, WebviewUrl, WebviewWindowBuilder};
    use windows::Win32::UI::{
        Input::KeyboardAndMouse::GetAsyncKeyState,
        WindowsAndMessaging::{SetWindowPos, HWND_TOPMOST, SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOSIZE},
    };

    const VK_LBUTTON: i32 = 0x01;
    const TICK: Duration = Duration::from_millis(30);
    // Repositioning and re-asserting topmost costs more, so it runs every 15 ticks (~450 ms).
    const REFRESH_EVERY: u32 = 15;

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
    win.set_ignore_cursor_events(true)?;

    let app = app.clone();
    thread::spawn(move || {
        // (x, y, width, height) in physical pixels, or None when the drop must not be active.
        let mut area: Option<(i32, i32, u32, u32)> = None;
        let mut tick: u32 = 0;
        let mut pressed_outside = false;
        let mut capturing = false;

        loop {
            thread::sleep(TICK);

            // The icon moves around (taskbar moved, icons reordered, another monitor), so
            // its position is re-read instead of assuming a fixed place.
            if tick % REFRESH_EVERY == 0 {
                area = None;
                if let Some(tray) = app.tray_by_id("main-tray") {
                    if let Ok(Some(rect)) = tray.rect() {
                        let scale = win.scale_factor().unwrap_or(1.0);
                        let pos = rect.position.to_physical::<i32>(scale);
                        let size = rect.size.to_physical::<u32>(scale);
                        let cx = pos.x as f64 + size.width as f64 / 2.0;
                        let cy = pos.y as f64 + size.height as f64 / 2.0;

                        // Icon hidden in the overflow menu: its center falls inside the work
                        // area (the real tray sits in the taskbar strip, outside it).
                        // With no visible icon there is nowhere to drop.
                        let hidden = matches!(
                            win.monitor_from_point(cx, cy),
                            Ok(Some(m)) if {
                                let wa = m.work_area();
                                cx >= wa.position.x as f64
                                    && cx < (wa.position.x + wa.size.width as i32) as f64
                                    && cy >= wa.position.y as f64
                                    && cy < (wa.position.y + wa.size.height as i32) as f64
                            }
                        );
                        if !hidden {
                            area = Some((pos.x, pos.y, size.width, size.height));
                        }
                    }
                }

                match area {
                    Some((x, y, w, h)) => {
                        let _ = win.set_size(PhysicalSize::new(w, h));
                        let _ = win.set_position(PhysicalPosition::new(x, y));
                        if !win.is_visible().unwrap_or(false) {
                            let _ = win.show();
                        }
                        // The taskbar is also "always on top" and raises itself on every
                        // interaction. Tauri ignores set_always_on_top when the state does
                        // not change, so Windows is called directly.
                        if let Ok(hwnd) = win.hwnd() {
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
                    }
                    None => {
                        let _ = win.hide();
                    }
                }
            }
            tick = tick.wrapping_add(1);

            let Some((x, y, w, h)) = area else {
                continue;
            };
            let Ok(cursor) = app.cursor_position() else {
                continue;
            };
            let inside = cursor.x >= x as f64
                && cursor.x < (x + w as i32) as f64
                && cursor.y >= y as f64
                && cursor.y < (y + h as i32) as f64;
            let button_down = unsafe { GetAsyncKeyState(VK_LBUTTON) } as u16 & 0x8000 != 0;

            if !button_down {
                pressed_outside = false;
                if capturing {
                    let _ = win.set_ignore_cursor_events(true);
                    capturing = false;
                }
                continue;
            }

            if !inside {
                pressed_outside = true;
            } else if pressed_outside && !capturing {
                // The button was already down before reaching the icon: this is a drag.
                let _ = win.set_ignore_cursor_events(false);
                capturing = true;
            }
        }
    });

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init());

    // Autostart only exists on desktop. The window is created hidden (visible: false), so
    // starting with the system opens just the tray.
    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_autostart::init(
        tauri_plugin_autostart::MacosLauncher::LaunchAgent,
        None,
    ));

    // The shortcut itself is registered from JS (`src/tray/shortcut.ts`), because the
    // combination is a user setting stored in localStorage.
    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_global_shortcut::Builder::new().build());

    builder
        .setup(|app| {
            // Windows only: on macOS and Linux the native tray is enough (and on Linux the
            // icon position is not even available).
            #[cfg(windows)]
            setup_tray_drop(app.handle())?;
            #[cfg(not(windows))]
            let _ = app;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
