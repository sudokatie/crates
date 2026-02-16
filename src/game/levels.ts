// Crates - Microban Level Pack (first 20 levels)
// Original levels by David W. Skinner

export interface LevelData {
  name: string;
  data: string;
}

export const LEVELS: LevelData[] = [
  {
    name: "First Steps",
    data: `####
#.@#
#$ #
#  #
####`
  },
  {
    name: "Two Targets",
    data: `######
#    #
# #@ #
# $. #
# .$ #
#    #
######`
  },
  {
    name: "Corner Push",
    data: `  ####
###  #
#    #
# #  #
# $@.#
######`
  },
  {
    name: "Four Corners",
    data: `########
#      #
# .$$. #
#  @   #
# .$$. #
#      #
########`
  },
  {
    name: "The Corridor",
    data: `#######
#     #
#.$ $ #
# @ $ #
#.  $ #
#.  . #
#######`
  },
  {
    name: "Simple Maze",
    data: `  #####
###   #
# $   #
#.#.# #
#   $@#
#  ####
####`
  },
  {
    name: "Side by Side",
    data: `#####
#   ##
#    #
# $$ #
##. .#
 #@  #
 #####`
  },
  {
    name: "Push It",
    data: `######
#    #
# ## ##
# #.  #
# $ $ #
# # @.#
#   ###
#####`
  },
  {
    name: "The Box",
    data: `#######
#  .  #
# #.# #
#  $  #
##$@$##
#  $  #
# #.# #
#  .  #
#######`
  },
  {
    name: "Winding Path",
    data: `  ######
###    #
#   ## #
# #$   #
# . .#@#
####$  #
   #  ##
   ####`
  },
  {
    name: "The L",
    data: `####
#  ####
# $   #
#  $# #
## .  #
 # .@##
 #####`
  },
  {
    name: "Double Stack",
    data: `  ####
  #  #
  #. #
### $###
#   $  #
# .*.@ #
#   #  #
########`
  },
  {
    name: "Central",
    data: `#######
#     #
# .#. #
# $@$ #
# .#. #
#     #
#######`
  },
  {
    name: "The Squeeze",
    data: `  #####
###   #
#   $ #
#  #$##
##.@. #
 ##   #
  #####`
  },
  {
    name: "Back and Forth",
    data: `#####
#   ##
# .  #
##*# #
#  $ #
# @  #
######`
  },
  {
    name: "Precision",
    data: `######
#    ##
#  $  #
#.#$#.#
#  @ ##
# $   #
##.  ##
 #####`
  },
  {
    name: "The Cross",
    data: `  ####
 ##  #
## $ #
# $@$#
#  $ #
## . ##
 #...#
 #####`
  },
  {
    name: "Corridors",
    data: `  #####
###   #
#   # #
#.#$  #
#.  $##
#.#$@#
#    #
######`
  },
  {
    name: "Tricky",
    data: `  ####
###  ###
#   $  #
# #  # #
#..$+..#
# #  # #
#   $  #
###  ###
  ####`
  },
  {
    name: "Challenge",
    data: `   ####
####  #
# $ $ #
# .#. #
# $.$ #
##.@ ##
 #   #
 #####`
  },
  {
    name: "Tight Quarters",
    data: `######
#  . #
# $# #
#.$@.#
# $  #
#    #
######`
  },
  {
    name: "The Spiral",
    data: `########
#      #
# #### #
# #..# #
# # $$ #
# #  @##
#    ##
######`
  },
  {
    name: "Double Trouble",
    data: `  #####
###   ###
#  $.$  #
# #. .# #
#  $.$  #
### @ ###
  #####`
  },
  {
    name: "Zig Zag",
    data: `#######
#     #
#.# # #
#.$ $ #
# # #@#
#   $ #
### . #
  #####`
  },
  {
    name: "The Vault",
    data: `#########
#   #   #
# $ . $ #
##.# #.##
 # $$  #
##.#@#.##
#       #
#########`
  }
];
