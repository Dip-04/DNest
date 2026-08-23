package com.dnest.app;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;

import java.io.File;
import java.io.FileOutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

final class MapWidgetRenderer {
    private static final int WIDTH = 480;
    private static final int HEIGHT = 220;
    private static final int TILE_SIZE = 256;
    private static final long MAX_TILE_AGE_MS = 7L * 24 * 60 * 60 * 1000;

    private MapWidgetRenderer() {}

    static Bitmap render(Context context, WidgetApi.State state) {
        WidgetApi.Person me = state.me();
        WidgetApi.Person partner = state.partner();
        if (!state.sharing() || partner == null
                || me.latitude() == null || me.longitude() == null
                || partner.latitude() == null || partner.longitude() == null) {
            return null;
        }

        int zoom = zoomFor(state.distanceKm());
        double centerLatitude = (me.latitude() + partner.latitude()) / 2;
        double centerLongitude = (me.longitude() + partner.longitude()) / 2;
        double centerX = worldX(centerLongitude, zoom);
        double centerY = worldY(centerLatitude, zoom);
        double left = centerX - WIDTH / 2.0;
        double top = centerY - HEIGHT / 2.0;

        Bitmap result = Bitmap.createBitmap(WIDTH, HEIGHT, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(result);
        canvas.drawColor(Color.rgb(232, 241, 239));
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);

        int firstX = (int) Math.floor(left / TILE_SIZE);
        int lastX = (int) Math.floor((left + WIDTH) / TILE_SIZE);
        int firstY = (int) Math.floor(top / TILE_SIZE);
        int lastY = (int) Math.floor((top + HEIGHT) / TILE_SIZE);
        int tileCount = 1 << zoom;
        boolean drewTile = false;

        for (int tileY = firstY; tileY <= lastY; tileY++) {
            if (tileY < 0 || tileY >= tileCount) continue;
            for (int tileX = firstX; tileX <= lastX; tileX++) {
                int wrappedX = ((tileX % tileCount) + tileCount) % tileCount;
                Bitmap tile = loadTile(context, zoom, wrappedX, tileY);
                if (tile == null) continue;
                canvas.drawBitmap(
                        tile,
                        (float) (tileX * TILE_SIZE - left),
                        (float) (tileY * TILE_SIZE - top),
                        paint
                );
                drewTile = true;
            }
        }
        if (!drewTile) return null;

        float meX = (float) (worldX(me.longitude(), zoom) - left);
        float meY = (float) (worldY(me.latitude(), zoom) - top);
        float partnerX = (float) (worldX(partner.longitude(), zoom) - left);
        float partnerY = (float) (worldY(partner.latitude(), zoom) - top);

        paint.setColor(Color.rgb(67, 164, 219));
        paint.setStrokeWidth(8);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeCap(Paint.Cap.ROUND);
        Path route = new Path();
        route.moveTo(meX, meY);
        float curve = Math.max(28, Math.abs(partnerX - meX) * 0.18f);
        route.cubicTo(
                meX + (partnerX - meX) * 0.32f,
                meY - curve,
                meX + (partnerX - meX) * 0.68f,
                partnerY + curve,
                partnerX,
                partnerY
        );
        canvas.drawPath(route, paint);

        drawPin(canvas, paint, meX, meY, me.name(), Color.rgb(238, 101, 139));
        drawPin(canvas, paint, partnerX, partnerY, partner.name(), Color.rgb(169, 95, 105));

        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.argb(190, 255, 255, 255));
        canvas.drawRoundRect(6, HEIGHT - 28, 142, HEIGHT - 5, 8, 8, paint);
        paint.setColor(Color.rgb(70, 70, 70));
        paint.setTextSize(15);
        paint.setTextAlign(Paint.Align.LEFT);
        canvas.drawText("© OpenStreetMap", 12, HEIGHT - 11, paint);
        return result;
    }

    private static void drawPin(
            Canvas canvas,
            Paint paint,
            float x,
            float y,
            String name,
            int color
    ) {
        float safeX = Math.max(24, Math.min(WIDTH - 24, x));
        float safeY = Math.max(24, Math.min(HEIGHT - 24, y));
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.WHITE);
        canvas.drawCircle(safeX, safeY, 23, paint);
        paint.setColor(color);
        canvas.drawCircle(safeX, safeY, 19, paint);
        paint.setColor(Color.WHITE);
        paint.setTextAlign(Paint.Align.CENTER);
        paint.setTextSize(18);
        paint.setFakeBoldText(true);
        String initial = name == null || name.isEmpty()
                ? "?"
                : name.substring(0, 1).toUpperCase();
        canvas.drawText(initial, safeX, safeY + 6, paint);
        paint.setFakeBoldText(false);
    }

    private static Bitmap loadTile(Context context, int zoom, int x, int y) {
        File directory = new File(context.getCacheDir(), "osm-widget-tiles");
        if (!directory.exists() && !directory.mkdirs()) return null;
        File cached = new File(directory, zoom + "_" + x + "_" + y + ".png");
        if (cached.isFile()
                && System.currentTimeMillis() - cached.lastModified() < MAX_TILE_AGE_MS) {
            Bitmap bitmap = BitmapFactory.decodeFile(cached.getAbsolutePath());
            if (bitmap != null) return bitmap;
        }

        HttpURLConnection connection = null;
        try {
            URL url = new URL(
                    "https://tile.openstreetmap.org/" + zoom + "/" + x + "/" + y + ".png"
            );
            connection = (HttpURLConnection) url.openConnection();
            connection.setConnectTimeout(6_000);
            connection.setReadTimeout(6_000);
            connection.setRequestProperty(
                    "User-Agent",
                    "DNest/1.2 (https://dnest-app.vercel.app)"
            );
            if (connection.getResponseCode() != 200) return null;
            Bitmap bitmap = BitmapFactory.decodeStream(connection.getInputStream());
            if (bitmap != null) {
                try (FileOutputStream output = new FileOutputStream(cached)) {
                    bitmap.compress(Bitmap.CompressFormat.PNG, 100, output);
                }
            }
            return bitmap;
        } catch (Exception ignored) {
            return cached.isFile()
                    ? BitmapFactory.decodeFile(cached.getAbsolutePath())
                    : null;
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private static int zoomFor(Integer distanceKm) {
        if (distanceKm == null) return 10;
        if (distanceKm < 2) return 14;
        if (distanceKm < 10) return 12;
        if (distanceKm < 50) return 9;
        if (distanceKm < 200) return 7;
        if (distanceKm < 800) return 5;
        if (distanceKm < 3000) return 3;
        return 2;
    }

    private static double worldX(double longitude, int zoom) {
        return (longitude + 180.0) / 360.0 * TILE_SIZE * (1 << zoom);
    }

    private static double worldY(double latitude, int zoom) {
        double safeLatitude = Math.max(-85.0511, Math.min(85.0511, latitude));
        double radians = Math.toRadians(safeLatitude);
        double mercator = Math.log(Math.tan(radians) + 1.0 / Math.cos(radians));
        return (1.0 - mercator / Math.PI) / 2.0 * TILE_SIZE * (1 << zoom);
    }
}
