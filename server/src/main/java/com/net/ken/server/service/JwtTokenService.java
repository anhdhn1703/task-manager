package com.net.ken.server.service;

import com.net.ken.server.model.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
@Slf4j
public class JwtTokenService {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration}")
    private int jwtExpirationMs;

    @Value("${app.jwt.refresh-expiration}")
    private int refreshExpirationMs;

    /**
     * Tạo JWT token từ thông tin người dùng
     * @param userDetails thông tin chi tiết của người dùng
     * @return JWT token dạng chuỗi
     * @deprecated Sử dụng {@link #generateToken(UserDetails)} thay thế
     */
    @Deprecated
    public String generateJwtToken(UserDetails userDetails) {
        return generateToken(userDetails);
    }

    /**
     * Tạo JWT token từ thông tin người dùng
     * @param userDetails thông tin chi tiết của người dùng
     * @return JWT token dạng chuỗi
     */
    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }
    
    /**
     * Tạo JWT token với các claims tùy chỉnh
     * @param extraClaims thông tin claims bổ sung
     * @param userDetails thông tin chi tiết của người dùng
     * @return JWT token dạng chuỗi
     */
    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>(extraClaims);
        
        // Thêm thông tin thời gian thay đổi mật khẩu vào claims nếu userDetails là User
        if (userDetails instanceof User) {
            User user = (User) userDetails;
            if (user.getLastPasswordChangeDate() != null) {
                claims.put("pwdChangeTime", user.getLastPasswordChangeDate().toString());
            }
            
            // Thêm thông tin về trạng thái mật khẩu
            claims.put("pwdExpired", user.isPasswordExpired());
            claims.put("daysUntilPwdExpiry", user.getDaysUntilPasswordExpiry());
        }
        
        return buildToken(claims, userDetails, jwtExpirationMs);
    }
    
    /**
     * Tạo refresh token để làm mới access token
     * @param userDetails thông tin chi tiết của người dùng
     * @return refresh token dạng chuỗi
     */
    public String generateRefreshToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        
        // Thêm thông tin thời gian thay đổi mật khẩu vào claims nếu userDetails là User
        if (userDetails instanceof User) {
            User user = (User) userDetails;
            if (user.getLastPasswordChangeDate() != null) {
                claims.put("pwdChangeTime", user.getLastPasswordChangeDate().toString());
            }
            
            // Thêm thông tin về trạng thái mật khẩu vào refresh token
            claims.put("pwdExpired", user.isPasswordExpired());
            claims.put("daysUntilPwdExpiry", user.getDaysUntilPasswordExpiry());
        }
        
        return buildToken(claims, userDetails, refreshExpirationMs);
    }

    private String buildToken(Map<String, Object> extraClaims, UserDetails userDetails, long expiration) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);
        
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String getUsernameFromJwtToken(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }
    
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Xác thực JWT token và kiểm tra tính hợp lệ
     * 
     * @param authToken token cần xác thực
     * @return true nếu token hợp lệ, false nếu không hợp lệ 
     */
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(authToken);
            return true;
        } catch (SignatureException e) {
            log.error("JWT không hợp lệ: {}", e.getMessage());
            return false;
        } catch (MalformedJwtException e) {
            log.error("JWT không đúng định dạng: {}", e.getMessage());
            return false;
        } catch (ExpiredJwtException e) {
            log.error("JWT đã hết hạn: {}", e.getMessage());
            return false;
        } catch (UnsupportedJwtException e) {
            log.error("JWT không được hỗ trợ: {}", e.getMessage());
            return false;
        } catch (IllegalArgumentException e) {
            log.error("JWT rỗng: {}", e.getMessage());
            return false;
        }
    }
    
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = getUsernameFromJwtToken(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token) && 
                !(userDetails instanceof User && isTokenIssuedBeforePasswordChange(token, (User) userDetails)));
    }
    
    /**
     * Kiểm tra xem token có được tạo trước khi mật khẩu thay đổi hay không.
     * Nếu token được tạo trước khi mật khẩu thay đổi, token sẽ không còn hợp lệ.
     * 
     * @param token JWT token cần kiểm tra
     * @param user thông tin người dùng
     * @return true nếu token được tạo trước khi mật khẩu thay đổi, false nếu ngược lại
     */
    public boolean isTokenIssuedBeforePasswordChange(String token, User user) {
        if (user.getLastPasswordChangeDate() == null) {
            return false;
        }
        
        try {
            // Lấy thời gian tạo token
            Date issuedAt = extractClaim(token, Claims::getIssuedAt);
            
            // Lấy thời gian thay đổi mật khẩu từ claims (nếu có)
            Claims claims = extractAllClaims(token);
            String pwdChangeTimeInToken = (String) claims.get("pwdChangeTime");
            
            // Nếu không có thông tin thời gian thay đổi mật khẩu trong token
            // hoặc thông tin này khác với thông tin trong user, token không hợp lệ
            if (pwdChangeTimeInToken == null || 
                !pwdChangeTimeInToken.equals(user.getLastPasswordChangeDate().toString())) {
                return true;
            }
            
            return false;
        } catch (Exception e) {
            log.error("Lỗi khi kiểm tra thời gian tạo token: {}", e.getMessage());
            return true; // Coi như token không hợp lệ nếu có lỗi xảy ra
        }
    }
    
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
    
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public Map<String, Object> getAllClaimsFromToken(String token) {
        return extractAllClaims(token);
    }

    public Long getUserIdFromToken(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("userId", Long.class);
    }
} 