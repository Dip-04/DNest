package com.dnest.app;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.IBinder;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public final class BetweenUsLocationService extends Service implements LocationListener {
    static final String ACTION_STOP = "com.dnest.app.STOP_BETWEEN_US";
    private static final String CHANNEL_ID = "between_us_live";
    private static final int NOTIFICATION_ID = 2102;
    private final ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();
    private LocationManager locationManager;

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();
        startForeground(NOTIFICATION_ID, notification(null));
        locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
        requestUpdates();
        executor.scheduleWithFixedDelay(this::refresh, 0, 2, TimeUnit.MINUTES);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }
        return START_STICKY;
    }

    private void requestUpdates() {
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
                && checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            stopSelf();
            return;
        }
        try {
            locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 30_000, 50, this);
            locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 30_000, 50, this);
        } catch (IllegalArgumentException ignored) {
        }
    }

    @Override
    public void onLocationChanged(Location location) {
        executor.execute(() -> {
            try {
                WidgetApi.uploadLocation(this, location.getLatitude(), location.getLongitude());
            } catch (Exception ignored) {
            }
            refresh();
        });
    }

    @Override
    public void onProviderEnabled(String provider) {}

    @Override
    public void onProviderDisabled(String provider) {}

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {}

    private void refresh() {
        try {
            WidgetApi.State state = WidgetApi.fetch(this);
            getSystemService(NotificationManager.class).notify(NOTIFICATION_ID, notification(state));
        } catch (Exception ignored) {
        }
        BetweenUsWidgetProvider.refreshAll(this);
    }

    private Notification notification(WidgetApi.State state) {
        String title = "Between Us";
        String text = "Waiting for both locations";
        if (state != null && state.partner() != null) {
            title = state.me().name() + " ♥ " + state.partner().name();
            text = state.sharing() && state.distanceKm() != null
                    ? state.distanceKm() + " km apart · " + state.partner().localTime()
                    : "Ask your partner to turn on location";
        }
        Notification.Builder builder = new Notification.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_heart_pin)
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setCategory(Notification.CATEGORY_SERVICE)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setContentIntent(BetweenUsWidgetProvider.homeIntent(this));
        builder.getExtras().putBoolean("android.app.extra.REQUEST_PROMOTED_ONGOING", true);
        return builder.build();
    }

    private void createChannel() {
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Between Us live distance",
                NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription("Shows your shared distance while live location is enabled.");
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        getSystemService(NotificationManager.class).createNotificationChannel(channel);
    }

    @Override
    public void onDestroy() {
        if (locationManager != null) locationManager.removeUpdates(this);
        executor.shutdownNow();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}

