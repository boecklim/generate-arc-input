#!/bin/bash

hexString=$(node testArc.js --extended --print --$1 submit1Tx)

curl --location 'https://'$2'/v1/tx' \
--header 'X-CallbackUrl: '$3'' \
--header 'X-FullStatusUpdates: '$4'' \
--header 'Content-Type: application/json' \
--header 'Authorization: '$5'' \
--data '{
    "rawTx": "'$hexString'"
}'
