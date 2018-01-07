package com.landsmann.sufusku.model

data class Group(val data: MutableList<Int> = (0..9).map { 0 }.toMutableList())