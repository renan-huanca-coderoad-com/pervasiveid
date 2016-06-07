#!/bin/bash

#for i in 60 120 180 240 300; do
#for i in 60 120 180 240 300 540 720 1440; do
#for i in 10 60 120; do
#for i in 60; do
   DIR=out$i
   echo $DIR
   mkdir $DIR 
   ./reset.sh
   echo $x
   time ./run.sh $DIR $i 10 | tee $DIR/data.csv 
done    
