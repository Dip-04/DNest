package com.dnest.app;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

public final class MainActivity extends Activity {
    private static final int PERMISSIONS = 42;
    private EditText serverField;
    private EditText tokenField;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        setContentView(buildContent());
        acceptDeepLink(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        acceptDeepLink(intent);
    }

    private LinearLayout buildContent() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(24), dp(48), dp(24), dp(24));
        root.setBackgroundColor(Color.rgb(255, 247, 249));

        TextView title = new TextView(this);
        title.setText("DNest · Between Us");
        title.setTextSize(28);
        title.setTextColor(Color.rgb(61, 39, 51));
        root.addView(title, matchWrap());

        TextView help = new TextView(this);
        help.setText("Create an Android key in DNest Settings, then open the connection link or paste it here.");
        help.setTextSize(16);
        help.setPadding(0, dp(12), 0, dp(20));
        root.addView(help, matchWrap());

        serverField = field("https://your-dnest-domain.com", WidgetPreferences.server(this));
        tokenField = field("Private widget key", WidgetPreferences.token(this));
        root.addView(serverField, matchWrap());
        root.addView(tokenField, matchWrap());

        Button start = new Button(this);
        start.setText("Enable live lock-screen distance");
        start.setOnClickListener(view -> saveAndStart());
        root.addView(start, matchWrap());

        Button stop = new Button(this);
        stop.setText("Stop live distance");
        stop.setOnClickListener(view -> {
            stopService(new Intent(this, BetweenUsLocationService.class));
            Toast.makeText(this, "Live distance stopped", Toast.LENGTH_SHORT).show();
        });
        root.addView(stop, matchWrap());
        return root;
    }

    private void acceptDeepLink(Intent intent) {
        Uri data = intent == null ? null : intent.getData();
        if (data == null || !"dnest".equals(data.getScheme()) || !"connect".equals(data.getHost())) return;
        String server = data.getQueryParameter("server");
        String token = data.getQueryParameter("token");
        if (server != null) serverField.setText(server);
        if (token != null) tokenField.setText(token);
        saveAndStart();
    }

    private void saveAndStart() {
        String server = serverField.getText().toString().trim();
        String token = tokenField.getText().toString().trim();
        WidgetPreferences.save(this, server, token);
        if (!WidgetPreferences.configured(this)) {
            Toast.makeText(this, "Use an HTTPS server and a valid private key", Toast.LENGTH_LONG).show();
            return;
        }
        if (!hasLocationPermission()) {
            String[] permissions = Build.VERSION.SDK_INT >= 33
                    ? new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.POST_NOTIFICATIONS}
                    : new String[]{Manifest.permission.ACCESS_FINE_LOCATION};
            requestPermissions(permissions, PERMISSIONS);
            return;
        }
        startForegroundService(new Intent(this, BetweenUsLocationService.class));
        BetweenUsWidgetProvider.refreshAll(this);
        Toast.makeText(this, "Between Us is live", Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode == PERMISSIONS && hasLocationPermission()) saveAndStart();
    }

    private boolean hasLocationPermission() {
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private EditText field(String hint, String value) {
        EditText field = new EditText(this);
        field.setHint(hint);
        field.setText(value);
        field.setSingleLine(true);
        field.setPadding(dp(12), dp(12), dp(12), dp(12));
        return field;
    }

    private LinearLayout.LayoutParams matchWrap() {
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        params.setMargins(0, 0, 0, dp(12));
        return params;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}

