package se.landsmann.sufusku;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class Matrix {

    private List<List<Cell>> data = new ArrayList<>(9);

    {
        for (int i = 0; i < 9; i++) {
            List<Cell> row = new ArrayList<>(9);
            data.add(row);
            for (int j = 0; j < 9; j++) {
                row.add(new Cell());
            }
        }

        for (int row = 0; row < 9; row++) {
            for (int col = 0; col < 9; col++) {
                Cell cell = getCell(row, col);
                cell.setRow(getRow(row));
                cell.setCol(getCol(col));
                cell.setGroup(getGroup(row, col));
            }
        }
    }

    private List<Cell> getGroup(int row, int col) {

        List<Cell> group = new ArrayList<>(9);

        int minX = 0;
        int maxX = 0;
        int minY = 0;
        int maxY = 0;

        if (row >= 0 && row < 3) {
            minX = 0;
            maxX = 3;
        } else if (row >= 3 && row < 6) {
            minX = 3;
            maxX = 6;
        } else {
            minX = 6;
            maxX = 9;
        }

        if (col >= 0 && col < 3) {
            minY = 0;
            maxY = 3;
        } else if (col >= 3 && col < 6) {
            minY = 3;
            maxY = 6;
        } else {
            minY = 6;
            maxY = 9;
        }

        for (int i = minX; i < maxX; i++) {
            for (int j = minY; j < maxY; j++) {
                group.add(getCell(i, j));
            }
        }
        return group;
    }

    public Cell getCell(int row, int col) {
        return data.get(row).get(col);
    }

    public List<Cell> getRow(int i) {
        return data.get(i);
    }

    public List<Cell> getCol(int i) {
        return data.stream()
                .map(row -> row.get(i))
                .collect(Collectors.toList());
    }

    public int getCellValue(int row, int col) {
        return getCell(row, col).getValue();
    }

    public void setCellValue(int row, int col, int value) {
        getCell(row, col).setValue(value);
    }

    public String toJson() {
        JSONArray rows = new JSONArray();

        for (int i = 0; i < 9; i++) {

            JSONArray row = new JSONArray();
            rows.put(row);

            for (int j = 0; j < 9; j++) {
                JSONObject cell = new JSONObject();
                Cell c = getCell(i, j);
                cell.put("value", c.getValue());
                cell.put("numbers", c.getNumbers());
                row.put(cell);
            }
        }

        return rows.toString();
    }

    public void reset() {
        for (int i = 0; i < 9; i++) {
            for (int j = 0; j < 9; j++) {
                getCell(i, j).reset();
            }
        }
    }
}
