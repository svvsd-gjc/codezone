# Building the container with proper credentials

## Starting and building the Docker container
Start the Docker with this command after running ```sudo docker build.``` thrn grab the image ID with ```sudo docker image ls -a```
```sudo docker run --name=CodeZone -p 3000:3000 -p 5555:5555 *Image ID*```
To run with the repository, use the -v modifer to mount the repository directly to the container form your system

### Example of the -v modifer
```sudo docker run --name=CodeZone -p 3000:3000 -p 5555:5555 -v *path to repository*:/CodeZone *Image ID*```