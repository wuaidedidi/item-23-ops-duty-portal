from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "pageSize"
    max_page_size = 50

    def get_payload(self, data):
        return {
            "list": data,
            "total": self.page.paginator.count,
            "page": self.page.number,
            "pageSize": self.get_page_size(self.request),
            "totalPages": self.page.paginator.num_pages,
        }
