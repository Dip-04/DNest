package com.dnest.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.widget.RemoteViews;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class BetweenUsWidgetProvider extends AppWidgetProvider {
    private static final ExecutorService EXECUTOR = Executors.newSingleThreadExecutor();

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        refreshAll(context);
    }

    static void refreshAll(Context context) {
        Context app = context.getApplicationContext();
        EXECUTOR.execute(() -> {
            WidgetApi.State state = null;
            try {
                state = WidgetApi.fetch(app);
            } catch (Exception ignored) {
            }
            render(app, state);
        });
    }

    private static void render(Context context, WidgetApi.State state) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, BetweenUsWidgetProvider.class));
        for (int id : ids) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.between_us_widget);
            views.setImageViewResource(R.id.widget_map, R.drawable.route_line);
            if (state == null) {
                views.setTextViewText(R.id.widget_title, "Between Us");
                views.setTextViewText(R.id.widget_people, "Tap here, then connect in DNest Settings");
                views.setTextViewText(R.id.widget_distance, "—");
            } else {
                String partner = state.partner() == null ? "Your partner" : state.partner().name();
                views.setTextViewText(R.id.widget_title, "Between Us · " + partner);
                views.setTextViewText(R.id.widget_people,
                        state.me().name() + "  ♥  " + partner +
                                (state.partner() == null ? "" : " · " + state.partner().localTime()));
                views.setTextViewText(R.id.widget_distance,
                        state.sharing() && state.distanceKm() != null
                                ? state.distanceKm() + " km apart"
                                : "Waiting for both locations");
                Bitmap map = MapWidgetRenderer.render(context, state);
                if (map != null) views.setImageViewBitmap(R.id.widget_map, map);
            }
            views.setOnClickPendingIntent(R.id.widget_root, homeIntent(context));
            manager.updateAppWidget(id, views);
        }
    }

    static PendingIntent homeIntent(Context context) {
        String server = WidgetPreferences.server(context);
        Intent intent = server.isEmpty()
                ? new Intent(context, MainActivity.class)
                : new Intent(Intent.ACTION_VIEW, Uri.parse(server + "/home"));
        return PendingIntent.getActivity(
                context,
                100,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }
}
