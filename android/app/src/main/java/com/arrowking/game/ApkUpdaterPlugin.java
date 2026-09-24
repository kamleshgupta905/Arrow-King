package com.arrowking.game;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Downloads a GitHub release APK into app cache and opens the system installer.
 * Silent installs are not possible on a normal phone — this is the one-tap path.
 */
@CapacitorPlugin(name = "ApkUpdater")
public class ApkUpdaterPlugin extends Plugin {

    @PluginMethod
    public void canInstall(PluginCall call) {
        boolean allowed = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            allowed = getContext().getPackageManager().canRequestPackageInstalls();
        }
        JSObject ret = new JSObject();
        ret.put("allowed", allowed);
        call.resolve(ret);
    }

    @PluginMethod
    public void openInstallSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Intent intent = new Intent(
                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:" + getContext().getPackageName())
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void openExternal(PluginCall call) {
        final String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("Missing release URL");
            return;
        }
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        final String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("Missing release URL");
            return;
        }

        new Thread(() -> {
            try {
                File apk = download(url);
                runOnUi(() -> {
                    try {
                        installApk(apk);
                        JSObject ret = new JSObject();
                        ret.put("started", true);
                        call.resolve(ret);
                    } catch (Exception ex) {
                        call.reject(ex.getMessage() == null ? "Installer failed" : ex.getMessage());
                    }
                });
            } catch (Exception ex) {
                runOnUi(() -> call.reject(ex.getMessage() == null ? "Download failed" : ex.getMessage()));
            }
        }).start();
    }

    private void runOnUi(Runnable task) {
        if (getActivity() != null) {
            getActivity().runOnUiThread(task);
        } else {
            task.run();
        }
    }

    private File download(String rawUrl) throws Exception {
        HttpURLConnection conn = open(rawUrl);
        int code = conn.getResponseCode();
        int hops = 0;
        while (code >= 300 && code < 400 && hops < 6) {
            String next = conn.getHeaderField("Location");
            conn.disconnect();
            if (next == null) break;
            conn = open(next);
            code = conn.getResponseCode();
            hops += 1;
        }
        if (code != HttpURLConnection.HTTP_OK) {
            conn.disconnect();
            throw new Exception("Download failed (" + code + ")");
        }

        int length = conn.getContentLength();
        File out = new File(getContext().getCacheDir(), "Arrow-King-update.apk");
        if (out.exists() && !out.delete()) {
            out = new File(getContext().getCacheDir(), "Arrow-King-update-" + System.currentTimeMillis() + ".apk");
        }

        InputStream in = conn.getInputStream();
        FileOutputStream fos = new FileOutputStream(out);
        byte[] buffer = new byte[8192];
        int read;
        int total = 0;
        int lastPct = 0;
        while ((read = in.read(buffer)) != -1) {
            fos.write(buffer, 0, read);
            total += read;
            if (length > 0) {
                int pct = (int) ((total * 100L) / length);
                if (pct >= lastPct + 2) {
                    lastPct = pct;
                    JSObject event = new JSObject();
                    event.put("progress", pct);
                    notifyListeners("progress", event);
                }
            }
        }
        fos.flush();
        fos.close();
        in.close();
        conn.disconnect();

        emitProgress(100);
        return out;
    }

    private void emitProgress(int pct) {
        runOnUi(() -> {
            JSObject event = new JSObject();
            event.put("progress", pct);
            notifyListeners("progress", event);
        });
    }

    private HttpURLConnection open(String rawUrl) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(rawUrl).openConnection();
        conn.setInstanceFollowRedirects(false);
        conn.setConnectTimeout(20000);
        conn.setReadTimeout(120000);
        conn.setRequestProperty("User-Agent", "ArrowKing-Updater/2.1");
        conn.setRequestProperty("Accept", "application/octet-stream,application/vnd.android.package-archive,*/*");
        conn.setRequestProperty("Accept-Encoding", "identity");
        conn.connect();
        return conn;
    }

    private void installApk(File apk) {
        Uri uri = FileProvider.getUriForFile(
            getContext(),
            getContext().getPackageName() + ".fileprovider",
            apk
        );
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(uri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
    }
}
