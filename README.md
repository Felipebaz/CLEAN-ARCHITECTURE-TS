#Microservicio de Pedidos
- **Dominio**: Order, Price, SKU, Quantuty, eventos de dominio.
- **Applications**: casos de uso CreateOrder, AddItemToOrder, puertos y DTOS
- **Infra**: repositorioInMemory, pricing estático, event bus no-op
- **HTTP**: endpoints mínimos con Fastify
- **Compsoición**: container.ts como composition root.
- **Test**: dominio + aceptación de casos de uso


## Comportamiento 
- POST/orders crea un pedido
- POST/orders/:orderId/items agreag una linea (SKU + qty) con precio actual
- Devuelve el total del pedido
