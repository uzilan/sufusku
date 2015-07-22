package se.landsmann.sufusku;

import org.json.JSONObject;

public class LogItem {

    private static int index = -1;
    private Matrix matrix;
    private Coordinates coordinates;
    private int value;

    public LogItem(Matrix matrix, Coordinates coordinates, int value) {
        index++;
        this.matrix = matrix;
        this.coordinates = coordinates;
        this.value = value;
    }

    public String toJson() {
        JSONObject obj = new JSONObject();
        obj.put("index", index);
        obj.put("coordinates", coordinates.toString());
        obj.put("value", value);
        return obj.toString();
    }

    public Matrix getMatrix() {
        return matrix;
    }

    public int getIndex() {
        return index;
    }

    public Coordinates getCoordinates() {
        return coordinates;
    }

    public int getValue() {
        return value;
    }
}
