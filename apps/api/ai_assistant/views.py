from rest_framework import views, status, permissions
from rest_framework.response import Response
from .services import AdditionalServices

class AIProductDescriptionView(views.APIView):
    permission_classes = [permissions.AllowAny] # Change to IsAuthenticated in prod

    def post(self, request):
        service = AdditionalServices()
        product_name = request.data.get('product_name')
        ingredients = request.data.get('ingredients')
        
        if not product_name:
            return Response({'error': 'Product name required'}, status=status.HTTP_400_BAD_REQUEST)
            
        description = service.generate_product_description(product_name, ingredients)
        return Response({'description': description})

class AISalesInsightView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        service = AdditionalServices()
        insight = service.analyze_sales_trends()
        return Response({'insight': insight})

class AIInventoryPredictionView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        service = AdditionalServices()
        prediction = service.predict_inventory_depletion()
        return Response({'prediction': prediction})

class AIChatView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        service = AdditionalServices()
        query = request.data.get('query')
        
        if not query:
            return Response({'error': 'Query required'}, status=status.HTTP_400_BAD_REQUEST)
            
        response = service.chat_assistant(query)
        return Response({'response': response})
