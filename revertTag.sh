#!/bin/bash
clear
echo "Tazama Demo Application Docker Revert Tag"
echo
echo
echo "Reverting Versioning of Application and Docker Compose Files..."
echo
cd ./scripts/
node revertTags.mjs
echo
echo
echo "Versioning Application and Docker Compose Files Completed Successfully"