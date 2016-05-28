#!/bin/bash
for i in `seq 1 144`;
do
   node pervasiveidxml.js -o $1 -t $2
done    
