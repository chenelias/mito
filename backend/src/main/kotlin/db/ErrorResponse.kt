package dev.eliaschen.mito.db

import kotlinx.serialization.Serializable

@Serializable
data class ErrorResponse(val message: String?)