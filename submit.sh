#!/bin/bash

hexString=$(node testArc.js --extended --print --$1 submitTx)

curl --location 'https://'$2'/v1/tx' \
--header 'X-CallbackUrl: '$3'' \
--header 'X-CallbackToken: '$4'' \
--header 'X-FullStatusUpdates: '$5'' \
--header 'Content-Type: application/json' \
--header 'Authorization: '$6'' \
--data '{
    "rawTx": "'$hexString'"
}'
