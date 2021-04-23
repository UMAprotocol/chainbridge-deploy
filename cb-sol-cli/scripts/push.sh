#!/usr/bin/env bash
# Calls deposit() on the SRC_BRIDGE to publish a price on the DST_ORACLE. Also publishes a price on the SRC_ORACLE
# to make sure that there are no price requests outstanding.

TIME=$1
cb-sol-cli --url $SRC_GATEWAY --privateKey $SRC_PK --gasPrice 10000000000 voting push-price --dest 1 --bridge $SRC_BRIDGE --resourceId $RESOURCE_ID --time $TIME
