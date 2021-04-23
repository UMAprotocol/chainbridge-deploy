#!/usr/bin/env bash
# Calls deposit() on the DST_BRIDGE to request a price on the SRC_ORACLE. Also requests a price on the DST_ORACLE
# so that the DST_HANDLER can publish a price here once a price is resolved on the SRC_ORACLE.

cb-sol-cli --url $DST_GATEWAY --privateKey $DST_PK --gasPrice 10000000000 voting request-price --dest 0 --bridge $DST_BRIDGE --resourceId $RESOURCE_ID  
