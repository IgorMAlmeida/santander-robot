#!/bin/sh
if [ -f "/../../tmp/.X99-lock" ]; then
    rm "/../../tmp/.X99-lock";
    rm -rfv "/../../tmp/*";
fi

npm start
