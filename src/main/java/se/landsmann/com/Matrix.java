package se.landsmann.com;

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
                cell.setGroup(getGroup(findGroup(row, col)));
            }
        }
    }

    private int findGroup(int row, int col) {
        if (row >= 0 && row < 3) {
            if (col >= 0 && col < 3) {
                return 1;
            } else if (col >= 3 && col <= 6) {
                return 4;
            } else {
                return 7;
            }
        } else if (row >= 3 && row < 6) {
            if (col >= 0 && col < 3) {
                return 2;
            } else if (col >= 3 && col <= 6) {
                return 5;
            } else {
                return 8;
            }
        } else {
            if (col >= 0 && col < 3) {
                return 3;
            } else if (col >= 3 && col <= 6) {
                return 6;
            } else {
                return 9;
            }
        }
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

    public List<Cell> getGroup(int i) {
        int minX = 0;
        int maxX = 0;
        int minY = 0;
        int maxY = 0;

        switch (i) {
            case 1:
            case 2:
            case 3:
                minX = 0;
                maxX = 2;
                break;
            case 4:
            case 5:
            case 6:
                minX = 3;
                maxX = 5;
                break;
            case 7:
            case 8:
            case 9:
                minX = 6;
                maxX = 8;
                break;
        }

        switch (i) {
            case 1:
            case 4:
            case 7:
                minY = 0;
                maxY = 2;
                break;
            case 2:
            case 5:
            case 8:
                minX = 3;
                maxX = 5;
                break;
            case 3:
            case 6:
            case 9:
                minX = 6;
                maxX = 8;
                break;
        }

        List<Cell> group = new ArrayList<>(9);

        for (int x = minX; x <= maxX; x++) {
            for (int y = minY; y <= maxY; y++) {
                group.add(getCell(x, y));
            }
        }

        return group;
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
                getCell(i,j).reset();
            }
        }
    }
}
