#!/bin/bash
#
# 
#
for i in `seq 1 144`;
do
   node pervasiveidxml2.js -o $1 -t $2 -w $3
done    
