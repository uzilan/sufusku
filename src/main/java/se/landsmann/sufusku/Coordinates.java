package se.landsmann.sufusku;

public class Coordinates {

    private char letter;
    private int number;

    public Coordinates(char letter, int number) {
        this.letter = letter;
        this.number = number;
    }

    @Override
    public String toString() {
        return "(" + letter + "," + (number + 1) + ")";
    }
}
