package se.landsmann.sufusku;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

public class Log {

    private Map<Integer, LogItem> log = new HashMap<>();
    private int currentIndex;

    public void reset() {
        log.clear();
    }

    public void add(int row, int col, int value, Matrix matrix) {
        Coordinates coordinates = new Coordinates((char) ('a' + col), row);
        LogItem logItem = new LogItem(matrix, coordinates, value);

        log.put(logItem.getIndex(), logItem);
        currentIndex = logItem.getIndex();
    }

    public LogItem getLogItem(int index) {
        return log.get(index);
    }

    public LogItem getCurrentIndexLogItem() {
        return log.get(currentIndex);
    }

    public String toJson() {
        JSONArray rows = new JSONArray();

        log.entrySet().stream()
                .forEach(e -> {
                    JSONObject obj = new JSONObject();
                    obj.put("index", e.getKey());
                    obj.put("coordinates", e.getValue().getCoordinates().toString());
                    obj.put("value", e.getValue().getValue());
                    rows.put(obj);
                });
        return rows.toString();
    }

    public void setCurrentIndex(int currentIndex) {
        this.currentIndex = currentIndex;
    }

    public boolean isLogIndexPointingToLatest() {
        return log.isEmpty() ||
                log.keySet().stream().mapToInt(Integer::intValue).max().getAsInt() == currentIndex;
    }

    public void resetToCurrentindex() {
        log.entrySet().removeIf(e -> e.getKey() > currentIndex);
    }
}
