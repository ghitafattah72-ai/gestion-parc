"""
Helper functions for standardized API responses
"""
from flask import jsonify


def success_response(message, data=None, status_code=200):
    """
    Return a standardized success response
    """
    response = {'message': message, 'success': True}
    if data is not None:
        response['data'] = data
    return jsonify(response), status_code


def error_response(message, status_code=400, details=None):
    """
    Return a standardized error response
    """
    response = {'message': message, 'success': False}
    if details:
        response['details'] = details
    return jsonify(response), status_code


def paginated_response(items, total, pages, current_page):
    """
    Return a standardized paginated response
    """
    return jsonify({
        'items': items,
        'pagination': {
            'total': total,
            'pages': pages,
            'current_page': current_page
        },
        'success': True
    }), 200


def file_export_response(file_buffer, mimetype, filename):
    """
    Return a file for download
    """
    from flask import send_file
    return send_file(
        file_buffer,
        mimetype=mimetype,
        as_attachment=True,
        download_name=filename
    )
