#!/bin/bash

# Azure Deployment Script for Child Growth Monitor
# This script automates the complete deployment to Azure including ML models

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="cgm-production-rg"
LOCATION="eastus2"
ENVIRONMENT="production"
APP_NAME="child-growth-monitor"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        print_error "Azure CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if logged into Azure
    if ! az account show &> /dev/null; then
        print_warning "Not logged into Azure. Please login first."
        az login
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker Desktop."
        exit 1
    fi
    
    print_success "Prerequisites check completed"
}

# Function to create resource group
create_resource_group() {
    print_status "Creating resource group: $RESOURCE_GROUP"
    
    if az group show --name $RESOURCE_GROUP &> /dev/null; then
        print_warning "Resource group $RESOURCE_GROUP already exists"
    else
        az group create --name $RESOURCE_GROUP --location $LOCATION
        print_success "Resource group created"
    fi
}

# Function to deploy Azure ML workspace
deploy_ml_workspace() {
    print_status "Deploying Azure ML workspace..."
    
    # Create Azure ML workspace
    az ml workspace create \
        --name "$APP_NAME-ml" \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --storage-account "cgmstorage${ENVIRONMENT}" \
        --key-vault "cgm-keyvault-${ENVIRONMENT}" \
        --application-insights "cgm-appinsights-${ENVIRONMENT}"
    
    # Create compute instance for training
    az ml compute create \
        --name "cgm-training-compute" \
        --type ComputeInstance \
        --size Standard_DS3_v2 \
        --workspace-name "$APP_NAME-ml" \
        --resource-group $RESOURCE_GROUP
    
    print_success "Azure ML workspace deployed"
}

# Function to deploy core infrastructure
deploy_infrastructure() {
    print_status "Deploying core Azure infrastructure..."
    
    # Create storage account
    az storage account create \
        --name "cgmstorage${ENVIRONMENT}" \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --sku Standard_GRS \
        --encryption-services blob \
        --https-only true
    
    # Create Key Vault
    az keyvault create \
        --name "cgm-keyvault-${ENVIRONMENT}" \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --sku premium
    
    # Create Application Insights
    az monitor app-insights component create \
        --app "cgm-appinsights-${ENVIRONMENT}" \
        --location $LOCATION \
        --resource-group $RESOURCE_GROUP \
        --application-type web
    
    # Create PostgreSQL database
    az postgres server create \
        --name "cgm-postgres-${ENVIRONMENT}" \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --admin-user cgmadmin \
        --admin-password "CGM$(openssl rand -base64 12)!" \
        --sku-name GP_Gen5_2 \
        --version 11 \
        --ssl-enforcement Enabled
    
    # Create database
    az postgres db create \
        --resource-group $RESOURCE_GROUP \
        --server-name "cgm-postgres-${ENVIRONMENT}" \
        --name cgm_production
    
    print_success "Core infrastructure deployed"
}

# Function to deploy container registry
deploy_container_registry() {
    print_status "Deploying Azure Container Registry..."
    
    az acr create \
        --name "cgmregistry${ENVIRONMENT}" \
        --resource-group $RESOURCE_GROUP \
        --sku Premium \
        --admin-enabled true
    
    print_success "Container registry deployed"
}

# Function to build and push Docker images
build_and_push_images() {
    print_status "Building and pushing Docker images..."
    
    # Login to container registry
    az acr login --name "cgmregistry${ENVIRONMENT}"
    
    # Build backend image
    print_status "Building backend image..."
    docker build -t "cgmregistry${ENVIRONMENT}.azurecr.io/${APP_NAME}-backend:latest" ./backend/
    docker push "cgmregistry${ENVIRONMENT}.azurecr.io/${APP_NAME}-backend:latest"
    
    # Build ML service image
    print_status "Building ML service image..."
    docker build -t "cgmregistry${ENVIRONMENT}.azurecr.io/${APP_NAME}-ml:latest" ./ml-service/
    docker push "cgmregistry${ENVIRONMENT}.azurecr.io/${APP_NAME}-ml:latest"
    
    print_success "Docker images built and pushed"
}

# Function to deploy App Services
deploy_app_services() {
    print_status "Deploying App Services..."
    
    # Create App Service Plan
    az appservice plan create \
        --name "cgm-asp-${ENVIRONMENT}" \
        --resource-group $RESOURCE_GROUP \
        --sku P1v3 \
        --is-linux
    
    # Create backend web app
    az webapp create \
        --name "${APP_NAME}-backend-${ENVIRONMENT}" \
        --resource-group $RESOURCE_GROUP \
        --plan "cgm-asp-${ENVIRONMENT}" \
        --deployment-container-image-name "cgmregistry${ENVIRONMENT}.azurecr.io/${APP_NAME}-backend:latest"
    
    # Create ML service web app
    az webapp create \
        --name "${APP_NAME}-ml-${ENVIRONMENT}" \
        --resource-group $RESOURCE_GROUP \
        --plan "cgm-asp-${ENVIRONMENT}" \
        --deployment-container-image-name "cgmregistry${ENVIRONMENT}.azurecr.io/${APP_NAME}-ml:latest"
    
    # Configure app settings
    configure_app_settings
    
    print_success "App Services deployed"
}

# Function to configure app settings
configure_app_settings() {
    print_status "Configuring application settings..."
    
    # Get connection strings
    STORAGE_CONNECTION=$(az storage account show-connection-string \
        --name "cgmstorage${ENVIRONMENT}" \
        --resource-group $RESOURCE_GROUP \
        --query connectionString -o tsv)
    
    DB_CONNECTION="postgresql://cgmadmin:$(az postgres server show \
        --name cgm-postgres-${ENVIRONMENT} \
        --resource-group $RESOURCE_GROUP \
        --query administratorLoginPassword -o tsv)@cgm-postgres-${ENVIRONMENT}.postgres.database.azure.com:5432/cgm_production"
    
    INSTRUMENTATION_KEY=$(az monitor app-insights component show \
        --app cgm-appinsights-${ENVIRONMENT} \
        --resource-group $RESOURCE_GROUP \
        --query instrumentationKey -o tsv)
    
    # Configure backend app settings
    az webapp config appsettings set \
        --name "${APP_NAME}-backend-${ENVIRONMENT}" \
        --resource-group $RESOURCE_GROUP \
        --settings \
            FLASK_ENV=production \
            DATABASE_URL="$DB_CONNECTION" \
            AZURE_STORAGE_CONNECTION_STRING="$STORAGE_CONNECTION" \
            APPLICATIONINSIGHTS_INSTRUMENTATION_KEY="$INSTRUMENTATION_KEY" \
            ML_SERVICE_URL="https://${APP_NAME}-ml-${ENVIRONMENT}.azurewebsites.net"
    
    # Configure ML service app settings
    az webapp config appsettings set \
        --name "${APP_NAME}-ml-${ENVIRONMENT}" \
        --resource-group $RESOURCE_GROUP \
        --settings \
            AZURE_STORAGE_CONNECTION_STRING="$STORAGE_CONNECTION" \
            APPLICATIONINSIGHTS_INSTRUMENTATION_KEY="$INSTRUMENTATION_KEY"
}

# Function to deploy ML models
deploy_ml_models() {
    print_status "Deploying ML models..."
    
    # Create ML model deployment (this would typically involve pre-trained models)
    print_status "Setting up MediaPipe model endpoint..."
    
    # For now, we'll use the containerized ML service
    # In production, you would register and deploy actual trained models
    
    print_warning "ML models will be deployed via containerized ML service"
    print_warning "For production, train and register models using Azure ML Studio"
}

# Function to set up monitoring
setup_monitoring() {
    print_status "Setting up monitoring and alerts..."
    
    # Create alert rules
    az monitor metrics alert create \
        --name "High Error Rate" \
        --resource-group $RESOURCE_GROUP \
        --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/${APP_NAME}-backend-${ENVIRONMENT}" \
        --condition "count requests/failed > 10" \
        --window-size 5m \
        --evaluation-frequency 1m \
        --severity 2
    
    az monitor metrics alert create \
        --name "High Response Time" \
        --resource-group $RESOURCE_GROUP \
        --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/${APP_NAME}-backend-${ENVIRONMENT}" \
        --condition "average requests/duration > 2000" \
        --window-size 5m \
        --evaluation-frequency 1m \
        --severity 3
    
    print_success "Monitoring configured"
}

# Function to display deployment summary
display_summary() {
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📊 Deployment Summary:"
    echo "===================="
    echo "Resource Group: $RESOURCE_GROUP"
    echo "Location: $LOCATION"
    echo "Environment: $ENVIRONMENT"
    echo ""
    echo "🌐 Application URLs:"
    echo "Backend API: https://${APP_NAME}-backend-${ENVIRONMENT}.azurewebsites.net"
    echo "ML Service: https://${APP_NAME}-ml-${ENVIRONMENT}.azurewebsites.net"
    echo ""
    echo "🔧 Azure Resources Created:"
    echo "- Azure ML Workspace: $APP_NAME-ml"
    echo "- Storage Account: cgmstorage${ENVIRONMENT}"
    echo "- PostgreSQL Database: cgm-postgres-${ENVIRONMENT}"
    echo "- Container Registry: cgmregistry${ENVIRONMENT}"
    echo "- Key Vault: cgm-keyvault-${ENVIRONMENT}"
    echo "- Application Insights: cgm-appinsights-${ENVIRONMENT}"
    echo ""
    echo "💰 Estimated Monthly Cost: ~$960"
    echo ""
    echo "📝 Next Steps:"
    echo "1. Configure Azure B2C for authentication"
    echo "2. Train custom ML models using Azure ML Studio"
    echo "3. Set up CI/CD pipeline in Azure DevOps"
    echo "4. Configure domain and SSL certificates"
    echo "5. Set up backup and disaster recovery"
    echo ""
    echo "📚 Documentation:"
    echo "- Azure Portal: https://portal.azure.com"
    echo "- Azure ML Studio: https://ml.azure.com"
    echo "- Deployment Guide: ./AZURE_DEPLOYMENT_GUIDE.md"
}

# Main deployment function
main() {
    echo "🚀 Starting Azure deployment for Child Growth Monitor..."
    echo ""
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --resource-group)
                RESOURCE_GROUP="$2"
                shift 2
                ;;
            --location)
                LOCATION="$2"
                shift 2
                ;;
            --skip-ml)
                SKIP_ML=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --environment ENV    Deployment environment (default: production)"
                echo "  --resource-group RG  Resource group name (default: cgm-production-rg)"
                echo "  --location LOC       Azure location (default: eastus2)"
                echo "  --skip-ml           Skip ML workspace deployment"
                echo "  --help              Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Run deployment steps
    check_prerequisites
    create_resource_group
    deploy_infrastructure
    deploy_container_registry
    
    if [[ "$SKIP_ML" != true ]]; then
        deploy_ml_workspace
        deploy_ml_models
    fi
    
    build_and_push_images
    deploy_app_services
    setup_monitoring
    display_summary
    
    echo ""
    print_success "🎯 Child Growth Monitor successfully deployed to Azure!"
}

# Run main function
main "$@"
