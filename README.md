# ZEBEC NETWORK MIGRATION CONTRACT

The Zebec Protocol and its ZBC token are currently undergoing a transition to The Zebec Network, accompanied by a corresponding change to the ZBCN token ticker. This adjustment aims to accurately reflect our evolving business model, expanded product portfolio, and the underlying infrastructure. The contract facilitates the migration of existing ZBC tokens to the new ZBCN tokens, which will have a maximum supply of 100 billion.

## Functions

1. **_init_config():_** <br>
   Initialize configurations for the migration program.
2. **_migrate_token():_** <br>
   Migrate ZBC tokens to ZBCN tokens. <br>
   This involves burning ZBC tokens held by the user & simultaneously minting equivalent amount of ZBCN tokens.
3. **_emergency_pause():_** <br>
   Pause/Resume migration process.
4. **_update_admin():_** <br>
   Update Admin of the migration program.

## Install the packages

`npm install`

## Build the program

`anchor build`

## Run the test

`anchor run test`

<sub>Note: The migration program is one way : 1 ZBC -> 10 ZBCN. <br>
The migration program will stop once 100,000,000,000 ZBCN tokens are minted.</sub>
