#!/bin/sh
if [ -f "/../../tmp/.X99-lock" ]; then
    rm "/../../tmp/.X99-lock";
fi

npm start
