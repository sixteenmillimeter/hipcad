#!/bin/bash

RED='\033[0;31m'  
NC='\033[0m' # No Color

echo "Starting in ${RED}dev${NC} mode"

rm run_dev.sh
jq -r ".apps[0].env | keys[]" ./process.json | while read key ; do
	/bin/echo -n $key= >> run_dev.sh
	/bin/echo -n $(jq ".apps[0].env.$key" ./process.json) >> run_dev.sh
	/bin/echo -n ' '  >> run_dev.sh
done
/bin/echo -n " node .">> run_dev.sh

#cat run_dev.sh
sh run_dev.sh