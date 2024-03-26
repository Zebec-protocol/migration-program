# ZEBEC NETWORK MIGRATION CONTRACT
The Zebec Protocol and its ZBC token are in the process of transitioning to The Zebec Network with a corresponding ZBCN token ticker to better represent our business and the expanded portfolio of products and the infrastructure that powers it. 

## Functions
1) ***init_config():*** <br>
   Initialize configurations for the migration program.
2) ***migrate_token():*** <br>
   Migrate ZBC tokens to ZBCN tokens. <br>
   This involves burning ZBC tokens held by the user & simultaneously minting equivalent amount of ZBCN tokens.
3) ***emergency_pause():*** <br>
   Pause/Resume migration process.
4) ***update_admin():*** <br>
   Update Admin of the migration program.


## Install the packages
```npm install```

## Build the program
```anchor build```

## Run the test
```anchor run test```

<sub>Note: The migration program is one way : ZBC -> ZBCN. <br>
The migration program will stop once 10,000,000,000 ZBCN tokens are minted.</sub>
