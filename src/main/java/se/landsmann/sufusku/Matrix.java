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
                row.add(new Cell(i, j, getGroupIndex(i, j)));
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

        GroupBounderies gb = GroupBounderies.getGroupBounderies(row, col);

        List<Cell> group = new ArrayList<>(9);

        for (int i = gb.minX; i < gb.maxX; i++) {
            for (int j = gb.minY; j < gb.maxY; j++) {
                group.add(getCell(i, j));
            }
        }
        return group;
    }

    private int getGroupIndex(int row, int col) {

        GroupBounderies gb = GroupBounderies.getGroupBounderies(row, col);

        if (gb.minX == 0) {
            if (gb.minY == 0) {
                return 1;
            } else if (gb.minY == 3) {
                return 2;
            } else {
                return 3;
            }
        } else if (gb.minX == 3) {
            if (gb.minY == 0) {
                return 4;
            } else if (gb.minY == 3) {
                return 5;
            } else {
                return 6;
            }
        } else {
            if (gb.minY == 0) {
                return 7;
            } else if (gb.minY == 3) {
                return 8;
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

    public int getCellValue(int row, int col) {
        return getCell(row, col).getValue();
    }

    public void setCellValue(int row, int col, int value) {
        Cell cell = getCell(row, col);
        cell.setValue(value);
        checkMatrixForCraziness();
    }

    private void checkMatrixForCraziness() {
        for (int i = 0; i < 9; i++) {
            for (int j = 0; j < 9; j++) {
                boolean isCrazy = checkIfCellIsCrazy(i, j);
                getCell(i, j).setIsCrazy(isCrazy);
            }
        }
    }

    private boolean checkIfCellIsCrazy(int row, int col) {
        int value = getCellValue(row, col);

        boolean isCrazy = getRow(row).stream()
                .filter(c -> c.getValue() != 0 && c.getColIndex() != col)
                .anyMatch(c -> c.getValue() == value);

        isCrazy |= getCol(col).stream()
                .filter(c -> c.getValue() != 0 && c.getRowIndex() != row)
                .anyMatch(c -> c.getValue() == value);

        isCrazy |= getGroup(row, col).stream()
                .filter(c -> c.getValue() != 0 && c.getRowIndex() != row && c.getColIndex() != col)
                .anyMatch(c -> c.getValue() == value);

        return isCrazy;
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
                cell.put("isCrazy", c.isCrazy());
                row.put(cell);
            }
        }

        JSONObject json = new JSONObject();
        json.put("matrix", rows);

        return json.toString();
    }

    public void reset() {
        for (int i = 0; i < 9; i++) {
            for (int j = 0; j < 9; j++) {
                getCell(i, j).reset();
            }
        }
    }
}
